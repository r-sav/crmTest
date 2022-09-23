using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;

namespace ContactRSTest
{
    public class AgeValidation : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            IPluginExecutionContext context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));

            if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity)
            {
                Entity entity = (Entity)context.InputParameters["Target"];

                if (entity.Contains("gendercode") && entity.Contains("birthdate"))
                {
                    var gender =  entity.GetAttributeValue<OptionSetValue>("gendercode");
                    var dateOfBirth = entity.GetAttributeValue<DateTime>("birthdate");

                    if (dateOfBirth != null && gender != null)
                    {
                        var ageYears = Years(dateOfBirth, DateTime.Now);

                        if ((gender.Value == 2 && ageYears > 18) || (gender.Value == 1 && ageYears > 21))
                        {
                            entity["description"] = "Validation Passed Successfully";
                            return;
                        }

                    }

                }
               
                throw new InvalidPluginExecutionException("Age Criteria not passed (Age > 18 (for Female) or Age > 21 (for Male))");
            }
        }

        int Years(DateTime start, DateTime end)
        {
            return (end.Year - start.Year - 1) +
                (((end.Month > start.Month) ||
                ((end.Month == start.Month) && (end.Day >= start.Day))) ? 1 : 0);
        }
    }
}
